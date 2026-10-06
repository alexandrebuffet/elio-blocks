#!/usr/bin/env bash
#
# Applies the protections of the GitHub repository: the rulesets of
# .github/rulesets/, the wordpress-org deployment environment, GitHub Pages
# and its github-pages environment, the Actions permissions and the security
# features. Run it once the repository is
# public (a private repository of a free account has none of them), by an
# admin, with the GitHub CLI signed in. Running it again updates in place.
#
# Usage: scripts/apply-github-settings.sh [owner/repo]

set -euo pipefail

repo="${1:-alexandrebuffet/elio-blocks}"
rulesets_dir="$(cd "$(dirname "$0")/.." && pwd)/.github/rulesets"

visibility="$(gh repo view "$repo" --json visibility --jq .visibility)"
if [ "$visibility" != "PUBLIC" ]; then
	echo "$repo is $visibility: make it public first, rulesets and environments need it on a free account." >&2
	exit 1
fi

echo "Repository settings"
gh api -X PATCH "repos/$repo" --silent --input - <<'JSON'
{
	"delete_branch_on_merge": true,
	"allow_auto_merge": false,
	"security_and_analysis": {
		"secret_scanning": { "status": "enabled" },
		"secret_scanning_push_protection": { "status": "enabled" }
	}
}
JSON
gh api -X PUT "repos/$repo/vulnerability-alerts" --silent
gh api -X PUT "repos/$repo/automated-security-fixes" --silent
gh api -X PUT "repos/$repo/private-vulnerability-reporting" --silent

echo "Actions permissions"
# Only GitHub's actions and the ones the workflows use, pinned by commit SHA.
# A composite action runs the actions it uses under the same policy:
# WordPress/plugin-check-action calls nick-fields/retry (since v1.1.9).
gh api -X PUT "repos/$repo/actions/permissions" --silent \
	-F enabled=true -f allowed_actions=selected -F sha_pinning_required=true
gh api -X PUT "repos/$repo/actions/permissions/selected-actions" --silent --input - <<'JSON'
{
	"github_owned_allowed": true,
	"verified_allowed": false,
	"patterns_allowed": [
		"shivammathur/setup-php@*",
		"WordPress/plugin-check-action@*",
		"nick-fields/retry@*",
		"10up/action-wordpress-plugin-deploy@*",
		"10up/action-wordpress-plugin-asset-update@*",
		"softprops/action-gh-release@*"
	]
}
JSON
gh api -X PUT "repos/$repo/actions/permissions/workflow" --silent \
	-f default_workflow_permissions=read -F can_approve_pull_request_reviews=false
# The workflows of a pull request from outside run once a maintainer approves them.
gh api -X PUT "repos/$repo/actions/permissions/fork-pr-contributor-approval" --silent \
	-f approval_policy=all_external_contributors

echo "Environment wordpress-org"
# The deploy jobs run in it: main (readme and assets) and release tags only,
# each deployment approved by the maintainer running this script.
reviewer_id="$(gh api user --jq .id)"
gh api -X PUT "repos/$repo/environments/wordpress-org" --silent --input - <<JSON
{
	"reviewers": [ { "type": "User", "id": $reviewer_id } ],
	"prevent_self_review": false,
	"can_admins_bypass": false,
	"deployment_branch_policy": { "protected_branches": false, "custom_branch_policies": true }
}
JSON
existing_policies="$(gh api "repos/$repo/environments/wordpress-org/deployment-branch-policies" --jq '.branch_policies[] | "\(.type) \(.name)"')"
for policy in "branch main" "tag *.*.*"; do
	if ! grep -qxF "$policy" <<<"$existing_policies"; then
		gh api -X POST "repos/$repo/environments/wordpress-org/deployment-branch-policies" --silent \
			-f type="${policy%% *}" -f name="${policy#* }"
	fi
done

echo "GitHub Pages"
# Built and deployed by the Deploy site workflow, from main only.
if gh api "repos/$repo/pages" --silent 2>/dev/null; then
	gh api -X PUT "repos/$repo/pages" --silent -f build_type=workflow
else
	gh api -X POST "repos/$repo/pages" --silent -f build_type=workflow
fi
gh api -X PUT "repos/$repo/environments/github-pages" --silent --input - <<'JSON'
{
	"deployment_branch_policy": { "protected_branches": false, "custom_branch_policies": true }
}
JSON
existing_policies="$(gh api "repos/$repo/environments/github-pages/deployment-branch-policies" --jq '.branch_policies[] | "\(.type) \(.name)"')"
if ! grep -qxF "branch main" <<<"$existing_policies"; then
	gh api -X POST "repos/$repo/environments/github-pages/deployment-branch-policies" --silent \
		-f type=branch -f name=main
fi

echo "Rulesets"
for file in "$rulesets_dir"/*.json; do
	name="$(jq -r .name "$file")"
	id="$(gh api "repos/$repo/rulesets" --jq ".[] | select(.name == \"$name\") | .id")"
	if [ -n "$id" ]; then
		gh api -X PUT "repos/$repo/rulesets/$id" --silent --input "$file"
		echo "  updated $name"
	else
		gh api -X POST "repos/$repo/rulesets" --silent --input "$file"
		echo "  created $name"
	fi
done

cat <<TEXT

Done. The WordPress.org SVN credentials go in the environment, not the repository:

	gh secret set SVN_USERNAME --env wordpress-org --repo $repo
	gh secret set SVN_PASSWORD --env wordpress-org --repo $repo
TEXT
