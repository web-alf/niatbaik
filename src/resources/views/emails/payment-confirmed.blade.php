<div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; color: #333;">
    <div style="background: #16a34a; padding: 24px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 20px;">Donasi Dikonfirmasi</h1>
    </div>
    <div style="padding: 24px; background: #fff; border: 1px solid #e5e7eb;">
        <p>Assalamu'alaikum {{ $invoice->donor_name }},</p>
        <p>Terima kasih! Donasi anda telah kami terima dan dikonfirmasi.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr><td style="padding: 8px 0; color: #6b7280;">Campaign</td><td style="padding: 8px 0; font-weight: bold;">{{ $invoice->campaign->title }}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280;">Nominal</td><td style="padding: 8px 0; font-weight: bold;">Rp {{ number_format($invoice->total, 0, ',', '.') }}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280;">Invoice</td><td style="padding: 8px 0;">{{ $invoice->invoice_number }}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280;">Tanggal</td><td style="padding: 8px 0;">{{ $invoice->paid_at?->translatedFormat('d F Y, H:i') }}</td></tr>
        </table>
        <p>Semoga donasi anda menjadi amal jariyah. Jazakallahu khairan.</p>
    </div>
    <div style="padding: 16px; text-align: center; color: #9ca3af; font-size: 12px;">
        NiatBaik — Platform Donasi Online
    </div>
</div>
