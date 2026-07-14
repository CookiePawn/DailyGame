export interface License {
    libraryName: string;
    version: string;
    _license: string;
    _description: string;
    homepage: string;
    repository: {
        type: string;
        url: string;
        directory: string;
    };
    _licenseContent: string;
}