package services

import (
	"fmt"
	"log"
	"net/smtp"
)

type MailService struct {
	host     string
	port     string
	user     string
	pass     string
	fromAddr string
}

func NewMailService(host, port, user, pass, fromAddr string) *MailService {
	return &MailService{
		host:     host,
		port:     port,
		user:     user,
		pass:     pass,
		fromAddr: fromAddr,
	}
}

func (m *MailService) SendPasswordReset(email, token string) error {
	resetLink := fmt.Sprintf("http://localhost:3000/reset-password?token=%s", token)
	subject := "Đặt lại mật khẩu - TicketVN"
	body := fmt.Sprintf(`
Xin chào,

Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản TicketVN của mình.

Vui lòng nhấp vào link sau để đặt lại mật khẩu (hiệu lực trong 15 phút):

%s

Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.

Trân trọng,
TicketVN Team
`, resetLink)

	msg := []byte(fmt.Sprintf("To: %s\r\nSubject: %s\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n%s", email, subject, body))

	if m.host == "" || m.user == "" {
		log.Printf("[MailService] SMTP not configured — password reset token for %s: %s", email, token)
		return nil
	}

	auth := smtp.PlainAuth("", m.user, m.pass, m.host)
	addr := fmt.Sprintf("%s:%s", m.host, m.port)

	if err := smtp.SendMail(addr, auth, m.fromAddr, []string{email}, msg); err != nil {
		log.Printf("[MailService] Failed to send email to %s: %v", email, err)
		return fmt.Errorf("failed to send email: %w", err)
	}

	log.Printf("[MailService] Password reset email sent to %s", email)
	return nil
}
