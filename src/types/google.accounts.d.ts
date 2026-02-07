// Type declarations for Google Identity Services (GIS)
// https://developers.google.com/identity/gsi/web/reference/js-reference

declare namespace google.accounts {
  namespace id {
    interface IdConfiguration {
      client_id: string;
      callback?: (response: CredentialResponse) => void;
      auto_select?: boolean;
      itp_support?: boolean;
    }

    interface CredentialResponse {
      credential: string;
      select_by: string;
    }

    interface GsiButtonConfiguration {
      type?: 'standard' | 'icon';
      theme?: 'outline' | 'filled_blue' | 'filled_black';
      size?: 'large' | 'medium' | 'small';
      text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
      shape?: 'rectangular' | 'pill' | 'circle' | 'square';
      width?: number;
    }

    function initialize(config: IdConfiguration): void;
    function prompt(callback?: (notification: PromptNotification) => void): void;
    function renderButton(parent: HTMLElement, config: GsiButtonConfiguration): void;
    function disableAutoSelect(): void;

    interface PromptNotification {
      isNotDisplayed(): boolean;
      isSkippedMoment(): boolean;
      isDismissedMoment(): boolean;
      getNotDisplayedReason(): string;
      getSkippedReason(): string;
      getDismissedReason(): string;
    }
  }

  namespace oauth2 {
    interface TokenClientConfig {
      client_id: string;
      scope: string;
      callback?: (response: TokenResponse) => void;
      error_callback?: (error: { type: string; message: string }) => void;
      prompt?: string;
    }

    interface TokenResponse {
      access_token: string;
      expires_in: number;
      scope: string;
      token_type: string;
      error?: string;
      error_description?: string;
    }

    interface TokenClient {
      requestAccessToken(config?: { prompt?: string }): void;
    }

    function initTokenClient(config: TokenClientConfig): TokenClient;
  }
}
