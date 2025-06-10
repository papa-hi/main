import { Resend } from 'resend';

export async function runEmailDiagnostics(): Promise<any> {
  const apiKey = process.env.RESEND_API_KEY;
  
  if (!apiKey) {
    return { error: 'RESEND_API_KEY not configured' };
  }

  const resend = new Resend(apiKey);
  const results: any = {};

  try {
    // Test 1: Check domain status
    console.log('Checking domain configuration...');
    const { data: domains, error: domainsError } = await resend.domains.list();
    
    if (domainsError) {
      results.domainError = domainsError;
    } else {
      results.domains = domains;
      const papaDomain = domains?.find((d: any) => d.name === 'papa-hi.com');
      results.papaDomainStatus = papaDomain || 'Domain not found';
    }

    // Test 2: Send test email with detailed logging
    console.log('Sending diagnostic test email...');
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'PaPa-Hi <papa@papa-hi.com>',
      to: ['papa@papa-hi.com'],
      subject: `Email Diagnostic Test - ${new Date().toISOString()}`,
      html: `
        <h1>Email Diagnostic Test</h1>
        <p>This is a diagnostic email sent at ${new Date().toISOString()}</p>
        <p>If you receive this email, the delivery is working correctly.</p>
        <p><strong>Domain:</strong> papa-hi.com</p>
        <p><strong>From:</strong> papa@papa-hi.com</p>
        <p><strong>To:</strong> papa@papa-hi.com</p>
      `,
      text: `Email Diagnostic Test - ${new Date().toISOString()}\n\nThis is a diagnostic email to test delivery.\nDomain: papa-hi.com\nFrom: papa@papa-hi.com\nTo: papa@papa-hi.com`
    });

    if (emailError) {
      results.emailError = emailError;
    } else {
      results.emailSuccess = emailData;
      console.log(`Diagnostic email sent successfully: ${emailData?.id}`);
    }

    // Test 3: Check email logs if available
    try {
      const { data: emails, error: emailsError } = await resend.emails.list({ limit: 5 });
      if (!emailsError) {
        results.recentEmails = emails;
      }
    } catch (err) {
      results.emailListError = 'Could not retrieve email logs';
    }

    return results;
  } catch (error) {
    console.error('Email diagnostics failed:', error);
    return { error: error.message };
  }
}

export async function checkEmailDelivery(emailId: string): Promise<any> {
  const apiKey = process.env.RESEND_API_KEY;
  
  if (!apiKey) {
    return { error: 'RESEND_API_KEY not configured' };
  }

  const resend = new Resend(apiKey);

  try {
    const { data, error } = await resend.emails.get(emailId);
    
    if (error) {
      return { error };
    }
    
    return { deliveryStatus: data };
  } catch (error) {
    return { error: error.message };
  }
}