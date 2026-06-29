/**
 * Tipos mínimos para la librería Google Identity Services (GIS),
 * cargada vía https://accounts.google.com/gsi/client en index.html.
 * Solo se declara lo que usamos.
 */

export interface CredentialResponse {
  /** JWT (ID token) firmado por Google. Esto es lo que enviamos al backend. */
  credential: string;
  select_by?: string;
}

export interface IdConfiguration {
  client_id: string;
  callback: (response: CredentialResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
}

export interface GsiButtonConfiguration {
  type?: 'standard' | 'icon';
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  logo_alignment?: 'left' | 'center';
  width?: number;
}

export interface GoogleAccountsId {
  initialize(config: IdConfiguration): void;
  renderButton(parent: HTMLElement, options: GsiButtonConfiguration): void;
  prompt(): void;
  disableAutoSelect(): void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: GoogleAccountsId;
      };
    };
  }
}
