package email

import (
	"fmt"
	"log"
	"net/smtp"
)

type SMTPProvider struct {
	host     string
	port     string
	user     string
	password string
	sender   string
}

func NewSMTPProvider(host, port, user, password, sender string) *SMTPProvider {
	return &SMTPProvider{
		host:     host,
		port:     port,
		user:     user,
		password: password,
		sender:   sender,
	}
}

func (p *SMTPProvider) SendOTP(email, code string) error {
	subject := "Your OTP for Barca Store"
	body := fmt.Sprintf("Your OTP code is: %s. It will expire in 10 minutes.", code)

	message := fmt.Sprintf("From: %s\r\n"+
		"To: %s\r\n"+
		"Subject: %s\r\n"+
		"\r\n"+
		"%s\r\n", p.sender, email, subject, body)

	auth := smtp.PlainAuth("", p.user, p.password, p.host)
	addr := fmt.Sprintf("%s:%s", p.host, p.port)

	log.Println("message", addr)
	log.Println(auth)

	err := smtp.SendMail(addr, auth, p.sender, []string{email}, []byte(message))
	if err != nil {
		return fmt.Errorf("failed to send email: %w", err)
	}

	return nil
}

func (p *SMTPProvider) SendPasswordReset(email, token string) error {
	subject := "Password Reset for Barca Store"
	body := fmt.Sprintf("Your password reset token is: %s. It will expire in 30 minutes.", token)

	message := fmt.Sprintf("From: %s\r\n"+
		"To: %s\r\n"+
		"Subject: %s\r\n"+
		"\r\n"+
		"%s\r\n", p.sender, email, subject, body)

	auth := smtp.PlainAuth("", p.user, p.password, p.host)
	addr := fmt.Sprintf("%s:%s", p.host, p.port)

	err := smtp.SendMail(addr, auth, p.sender, []string{email}, []byte(message))
	if err != nil {
		return fmt.Errorf("failed to send password reset email: %w", err)
	}

	return nil
}
