<?php
/**
 * Minimal stand-ins for the WordPress classes the plugin extends or instantiates.
 *
 * They only carry data: behaviour under test lives in the plugin classes.
 * Loaded from tests/bootstrap.php; integration tests use the real classes instead.
 */

// phpcs:disable

if (! class_exists('WP_Error')) {
	class WP_Error
	{
		public function __construct(
			private string $code = '',
			private string $message = '',
			private mixed $data = null,
		) {}

		public function get_error_code(): string
		{
			return $this->code;
		}

		public function get_error_message(): string
		{
			return $this->message;
		}

		public function get_error_data(): mixed
		{
			return $this->data;
		}
	}
}

if (! class_exists('WP_REST_Controller')) {
	abstract class WP_REST_Controller
	{
		protected $namespace;
		protected $rest_base;
	}
}

if (! class_exists('WP_REST_Request')) {
	class WP_REST_Request
	{
		/**
		 * Constructor.
		 *
		 * @param array<string, mixed> $params
		 */
		public function __construct(private array $params = []) {}

		public function get_param(string $key): mixed
		{
			return $this->params[$key] ?? null;
		}
	}
}

if (! class_exists('WP_REST_Response')) {
	class WP_REST_Response
	{
		public function __construct(public mixed $data = null, public int $status = 200) {}

		public function get_data(): mixed
		{
			return $this->data;
		}

		public function get_status(): int
		{
			return $this->status;
		}
	}
}

if (! class_exists('WP_Block')) {
	class WP_Block
	{
		/**
		 * Constructor.
		 *
		 * @param array<string, mixed> $attributes
		 * @param array<string, mixed> $context
		 * @param array<string, mixed> $parsed_block
		 */
		public function __construct(public array $attributes = [], public array $context = [], public array $parsed_block = []) {}
	}
}

if (! class_exists('WP_Block_Type')) {
	class WP_Block_Type
	{
		/**
		 * Constructor.
		 *
		 * @param array<string, mixed> $supports
		 */
		public function __construct(public string $name = '', public array $supports = []) {}
	}
}

if (! class_exists('WP_Block_Type_Registry')) {
	class WP_Block_Type_Registry
	{
		private static ?self $instance = null;

		/** @var array<string, WP_Block_Type> */
		private array $registered = [];

		public static function get_instance(): self
		{
			return self::$instance ??= new self();
		}

		public function register(WP_Block_Type $block_type): WP_Block_Type
		{
			return $this->registered[$block_type->name] = $block_type;
		}

		public function unregister(string $name): void
		{
			unset($this->registered[$name]);
		}

		public function get_registered(string $name): ?WP_Block_Type
		{
			return $this->registered[$name] ?? null;
		}
	}
}
