// Base email template with logo header and CAN-SPAM footer
// Used by all email templates

interface EmailTemplateProps {
  children: React.ReactNode;
  previewText?: string;
  unsubscribeUrl?: string;
}

export function EmailTemplate({ children, previewText, unsubscribeUrl }: EmailTemplateProps) {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        {previewText && (
          <style dangerouslySetInnerHTML={{
            __html: `
              .preview-text {
                display: none;
                font-size: 1px;
                color: #ffffff;
                line-height: 1px;
                max-height: 0px;
                max-width: 0px;
                opacity: 0;
                overflow: hidden;
              }
            `
          }} />
        )}
      </head>
      <body style={{
        margin: 0,
        padding: 0,
        backgroundColor: '#f5f5f5',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}>
        {previewText && (
          <div className="preview-text">{previewText}</div>
        )}

        {/* Email Container */}
        <table width="100%" cellPadding="0" cellSpacing="0" style={{ backgroundColor: '#f5f5f5' }}>
          <tr>
            <td align="center" style={{ padding: '40px 20px' }}>
              <table width="600" cellPadding="0" cellSpacing="0" style={{
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}>
                {/* Header with Logo */}
                <tr>
                  <td align="center" style={{
                    padding: '40px 40px 30px',
                    borderBottom: '1px solid #e5e5e5',
                  }}>
                    <img
                      src="https://theapexway.net/logo/apex-full-color.png"
                      alt="Apex Affinity Group"
                      width="240"
                      height="80"
                      style={{ maxWidth: '240px', height: 'auto' }}
                    />
                  </td>
                </tr>

                {/* Content */}
                <tr>
                  <td style={{ padding: '40px' }}>
                    {children}
                  </td>
                </tr>

                {/* Footer with CAN-SPAM */}
                <tr>
                  <td style={{
                    padding: '30px 40px',
                    borderTop: '1px solid #e5e5e5',
                    backgroundColor: '#f9f9f9',
                  }}>
                    <table width="100%" cellPadding="0" cellSpacing="0">
                      <tr>
                        <td style={{
                          fontSize: '12px',
                          lineHeight: '18px',
                          color: '#666666',
                          textAlign: 'center',
                        }}>
                          <p style={{ margin: '0 0 10px' }}>
                            <strong>Apex Affinity Group</strong><br />
                            Empowering Insurance Professionals Nationwide
                          </p>
                          <p style={{ margin: '0 0 10px', fontSize: '11px', color: '#888888' }}>
                            This email was sent to you because you signed up at theapexway.net
                          </p>
                          {unsubscribeUrl && (
                            <p style={{ margin: '10px 0 0' }}>
                              <a href={unsubscribeUrl} style={{
                                color: '#0066cc',
                                textDecoration: 'underline',
                              }}>
                                Unsubscribe from these emails
                              </a>
                            </p>
                          )}
                          <p style={{ margin: '10px 0 0', fontSize: '11px', color: '#888888' }}>
                            © {new Date().getFullYear()} Apex Affinity Group. All rights reserved.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  );
}

// Helper components for consistent email styling
export const Heading = ({ children }: { children: React.ReactNode }) => (
  <h1 style={{
    margin: '0 0 20px',
    fontSize: '28px',
    lineHeight: '36px',
    fontWeight: '600',
    color: '#1a1a1a',
  }}>
    {children}
  </h1>
);

export const Paragraph = ({ children }: { children: React.ReactNode }) => (
  <p style={{
    margin: '0 0 16px',
    fontSize: '16px',
    lineHeight: '24px',
    color: '#333333',
  }}>
    {children}
  </p>
);

export const Button = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <table cellPadding="0" cellSpacing="0" style={{ margin: '24px 0' }}>
    <tr>
      <td align="center" style={{
        backgroundColor: '#dc2626',
        borderRadius: '6px',
      }}>
        <a href={href} style={{
          display: 'inline-block',
          padding: '14px 32px',
          fontSize: '16px',
          fontWeight: '600',
          color: '#ffffff',
          textDecoration: 'none',
        }}>
          {children}
        </a>
      </td>
    </tr>
  </table>
);

export const Divider = () => (
  <hr style={{
    margin: '32px 0',
    border: 'none',
    borderTop: '1px solid #e5e5e5',
  }} />
);

export const InfoBox = ({ children }: { children: React.ReactNode }) => (
  <div style={{
    margin: '24px 0',
    padding: '20px',
    backgroundColor: '#f0f9ff',
    borderLeft: '4px solid #0066cc',
    borderRadius: '4px',
  }}>
    {children}
  </div>
);
