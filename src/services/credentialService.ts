const STORAGE_KEY = 'sdk_user_passwords';

export const credentialService = {
  /**
   * Retrieves all stored credentials mapping
   */
  getPasswords(): Record<string, string> {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch {
      return {};
    }
  },

  /**
   * Gets the stored password for a user ID or email
   */
  getUserPassword(userIdOrEmail: string): string | undefined {
    if (!userIdOrEmail) return undefined;
    const map = this.getPasswords();
    return map[userIdOrEmail.toLowerCase()] || map[userIdOrEmail] || 'password123';
  },

  /**
   * Sets and persists a user's password mapped by both ID and lowercase email
   */
  setUserPassword(userId: string, email: string, password: string): void {
    const map = this.getPasswords();
    if (userId) map[userId] = password;
    if (email) map[email.toLowerCase()] = password;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  },

  /**
   * Verifies password attempt against stored password.
   * Defaults to 'password123' if not explicitly configured.
   */
  verifyPassword(userId: string, email: string, inputPassword: string): boolean {
    const stored = this.getUserPassword(userId) || this.getUserPassword(email) || 'password123';
    return stored === inputPassword;
  },

  /**
   * Generates a strong, easy-to-use temporary password for new accounts
   */
  generateRandomPassword(): string {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%';
    let res = 'sdk-';
    for (let i = 0; i < 6; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  }
};
