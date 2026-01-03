// Singleton service to manage VS Code API instance
class VsCodeApiService {
    private static instance: VsCodeApiService;
    private vscodeApi: any = null;

    private constructor() {
        this.initializeApi();
    }

    public static getInstance(): VsCodeApiService {
        if (!VsCodeApiService.instance) {
            VsCodeApiService.instance = new VsCodeApiService();
        }
        return VsCodeApiService.instance;
    }

    private initializeApi(): void {
        if (typeof window !== 'undefined' && (window as any).acquireVsCodeApi && !this.vscodeApi) {
            try {
                this.vscodeApi = (window as any).acquireVsCodeApi();
            } catch (error) {
                console.warn('VS Code API already acquired, using existing instance');
                // If API was already acquired, try to get it from window
                this.vscodeApi = (window as any).vscode || null;
            }
        }
    }

    public getApi(): any {
        return this.vscodeApi;
    }

    public postMessage(message: any): void {
        if (this.vscodeApi) {
            this.vscodeApi.postMessage(message);
        } else {
            console.warn('VS Code API not available');
        }
    }

    public isAvailable(): boolean {
        return this.vscodeApi !== null;
    }
}

// Export singleton instance
export const vsCodeApi = VsCodeApiService.getInstance();