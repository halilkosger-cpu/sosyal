// Audit logging for admin activities
interface AuditLog {
  timestamp: string;
  action: string;
  email: string;
  ip?: string;
  status: 'success' | 'failed';
  details?: string;
}

const auditLogs: AuditLog[] = [];

export function logAudit(
  action: string,
  email: string,
  status: 'success' | 'failed',
  details?: string,
  ip?: string
): void {
  const log: AuditLog = {
    timestamp: new Date().toISOString(),
    action,
    email,
    status,
    details,
    ip,
  };

  auditLogs.push(log);

  // Keep only last 1000 logs in memory
  if (auditLogs.length > 1000) {
    auditLogs.shift();
  }

  // Log to console in development
  if (process.env.NODE_ENV !== 'production') {
    console.log(
      `[AUDIT] ${log.timestamp} | ${log.action} | ${log.email} | ${log.status}`,
      details ? `| ${details}` : ''
    );
  }
}

export function getAuditLogs(limit: number = 100): AuditLog[] {
  return auditLogs.slice(-limit);
}

export function getAuditLogsByEmail(email: string, limit: number = 50): AuditLog[] {
  return auditLogs.filter((log) => log.email === email).slice(-limit);
}
