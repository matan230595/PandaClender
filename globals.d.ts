// FIX: Manually define types for Vite's `import.meta.env` as the `vite/client`
// types were not being resolved. This makes environment variables type-safe.
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  confetti?: (options: any) => void;
  google?: any;
}
