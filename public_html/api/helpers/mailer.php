<?php
class Mailer {
    public static function send(string $to, string $subject, string $body): bool {
        $from    = 'Health Tracker <noreply@' . ($_SERVER['HTTP_HOST'] ?? 'localhost') . '>';
        $headers = implode("\r\n", [
            'From: ' . $from,
            'Content-Type: text/plain; charset=UTF-8',
            'MIME-Version: 1.0',
        ]);
        return mail($to, $subject, $body, $headers);
    }
}
