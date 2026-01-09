/**
 * Error Logging & Monitoring Utility
 * Centralizes error tracking and reporting
 */

const ErrorLog = {
  logs: [],
  maxLogs: 50,
  
  /**
   * Log an error
   */
  log(error, context = '', level = 'error') {
    try {
      const timestamp = new Date().toISOString();
      const logEntry = {
        timestamp,
        level,
        context,
        message: error?.message || String(error),
        stack: error?.stack || '',
        type: error?.name || 'Unknown',
      };

      this.logs.push(logEntry);

      // Keep only recent logs
      if (this.logs.length > this.maxLogs) {
        this.logs = this.logs.slice(-this.maxLogs);
      }

      // Log to console
      const prefix = `[${level.toUpperCase()}${context ? ` - ${context}` : ''}]`;
      if (level === 'error') {
        console.error(`🔴 ${prefix}`, error);
      } else if (level === 'warning') {
        console.warn(`⚠️ ${prefix}`, error);
      } else {
        console.log(`ℹ️ ${prefix}`, error);
      }

      return logEntry;
    } catch (loggingError) {
      console.error('❌ Logging failed:', loggingError);
    }
  },

  /**
   * Get all logs
   */
  getLogs() {
    try {
      return [...this.logs];
    } catch (error) {
      console.error('Failed to get logs:', error);
      return [];
    }
  },

  /**
   * Clear logs
   */
  clear() {
    try {
      this.logs = [];
    } catch (error) {
      console.error('Failed to clear logs:', error);
    }
  },

  /**
   * Export logs as JSON
   */
  export() {
    try {
      return JSON.stringify(this.logs, null, 2);
    } catch (error) {
      console.error('Failed to export logs:', error);
      return '';
    }
  },

  /**
   * Get logs by level
   */
  getByLevel(level) {
    try {
      return this.logs.filter(log => log.level === level);
    } catch (error) {
      console.error('Failed to filter logs:', error);
      return [];
    }
  },

  /**
   * Get logs by context
   */
  getByContext(context) {
    try {
      return this.logs.filter(log => log.context.includes(context));
    } catch (error) {
      console.error('Failed to filter logs by context:', error);
      return [];
    }
  },

  /**
   * Get recent logs
   */
  getRecent(count = 10) {
    try {
      return this.logs.slice(-count);
    } catch (error) {
      console.error('Failed to get recent logs:', error);
      return [];
    }
  },
};

export default ErrorLog;
