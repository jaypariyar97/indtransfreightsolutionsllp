package com.indtrans.freight.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Thin wrapper around Spring's JavaMailSender with a graceful fallback:
 * if SMTP isn't configured (or the send fails) we log the message at INFO
 * level so the operator can manually deliver the link during initial setup.
 *
 * SMTP env vars (set in .env / docker-compose):
 *   SPRING_MAIL_HOST, SPRING_MAIL_PORT, SPRING_MAIL_USERNAME,
 *   SPRING_MAIL_PASSWORD, APP_MAIL_FROM
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${app.mail.from:no-reply@indtransfreightsolutions.com}")
    private String mailFrom;

    @Value("${spring.mail.host:}")
    private String mailHost;

    public void send(String to, String subject, String body) {
        boolean smtpConfigured = mailSender != null && mailHost != null && !mailHost.isBlank();
        if (!smtpConfigured) {
            log.warn("=================================================================");
            log.warn("📧 SMTP not configured — falling back to log delivery.");
            log.warn("    To: {}", to);
            log.warn("    Subject: {}", subject);
            log.warn("    Body:\n{}", body);
            log.warn("=================================================================");
            return;
        }

        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(mailFrom);
            msg.setTo(to);
            msg.setSubject(subject);
            msg.setText(body);
            mailSender.send(msg);
            log.info("✉️  Email sent to {}", to);
        } catch (Exception ex) {
            log.error("Email send failed for {}: {}. Falling back to log:", to, ex.getMessage());
            log.warn("Subject: {}\nBody:\n{}", subject, body);
        }
    }
}
