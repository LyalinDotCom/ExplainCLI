export class SecurityService {
  private sensitivePatterns = [
    // API Keys and tokens
    /(?:api[_-]?key|apikey|access[_-]?token|auth[_-]?token|authentication[_-]?token|bearer[_-]?token)[\s:='"\]]*([a-zA-Z0-9\-_.]{20,})/gi,
    
    // AWS Keys
    /(?:aws[_-]?access[_-]?key[_-]?id|aws[_-]?secret[_-]?access[_-]?key)[\s:='"\]]*([a-zA-Z0-9/+=]{20,})/gi,
    
    // Private keys
    /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----[\s\S]+?-----END\s+(?:RSA\s+)?PRIVATE\s+KEY-----/g,
    
    // Database URLs with credentials
    /(?:mongodb|postgres|postgresql|mysql|redis):\/\/[^:]+:[^@]+@[^\s]+/gi,
    
    // Generic passwords
    /(?:password|passwd|pwd|pass)[\s:='"\]]*([^'"\s]{8,})/gi,
    
    // JWT tokens
    /eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g,
    
    // Email addresses (optional - uncomment if needed)
    // /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    
    // Credit card numbers
    /\b(?:\d{4}[\s-]?){3}\d{4}\b/g,
    
    // Social Security Numbers
    /\b\d{3}-\d{2}-\d{4}\b/g,
  ];

  redactSensitiveData(content: string): string {
    let redacted = content;
    
    for (const pattern of this.sensitivePatterns) {
      redacted = redacted.replace(pattern, (match) => {
        // Keep the key name but redact the value
        const parts = match.split(/[:='"\]]/);
        if (parts.length > 1) {
          return parts[0] + '=[REDACTED]';
        }
        return '[REDACTED]';
      });
    }
    
    // Redact .env file contents entirely
    redacted = redacted.replace(
      /--- \.env.*? ---[\s\S]*?(?=---|$)/g,
      '--- .env ---\n[ENTIRE FILE REDACTED FOR SECURITY]\n'
    );
    
    return redacted;
  }

  validateFilePath(path: string): boolean {
    // Ensure we're not accessing files outside the project
    const normalizedPath = path.replace(/\\/g, '/');
    
    // Check for directory traversal attempts
    if (normalizedPath.includes('../') || normalizedPath.includes('..\\')) {
      return false;
    }
    
    // Check for absolute paths that might escape the project
    if (normalizedPath.startsWith('/') || normalizedPath.match(/^[a-zA-Z]:/)) {
      return false;
    }
    
    return true;
  }

  isSecretFile(filename: string): boolean {
    const secretFiles = [
      '.env',
      '.env.local',
      '.env.production',
      '.env.development',
      'secrets.json',
      'credentials.json',
      'keyfile.json',
      'privatekey.pem',
      'id_rsa',
      'id_dsa',
      'id_ecdsa',
      'id_ed25519',
    ];
    
    const basename = filename.split('/').pop() || '';
    return secretFiles.includes(basename.toLowerCase());
  }

  sanitizeForDisplay(content: string): string {
    // Remove ANSI escape codes
    return content.replace(/\x1b\[[0-9;]*m/g, '');
  }
}