<?php

namespace ElioBlocks\Tests\Unit\Blocks;

use PHPUnit\Framework\TestCase;

/**
 * The render.php of each block prints get_block_wrapper_attributes() as it
 * returns them, escaped already. Through wp_kses_data(), WordPress 7.2 reads
 * them as text and decodes their &quot;: data-wp-context="{"location":…}" ends
 * the attribute at the first quote, and the report gets no data.
 */
class WrapperAttributesOutputTest extends TestCase
{
    public function testNoRenderTemplateFiltersItsWrapperAttributesThroughKses(): void
    {
        $templates = glob(dirname(__DIR__, 3) . '/src/blocks/*/render.php');
        $this->assertNotEmpty($templates);

        foreach ($templates as $template) {
            $this->assertDoesNotMatchRegularExpression(
                '/wp_kses\w*\(\s*(get_block_wrapper_attributes|\$\w*wrapper_attributes)/',
                (string) file_get_contents($template),
                $template
            );
        }
    }
}
