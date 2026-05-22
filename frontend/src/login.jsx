// Login page
const { useState: uS_login } = React;

function LoginPage({ onLogin }) {
  const [email, setEmail] = uS_login('');
  const [password, setPassword] = uS_login('');
  const [error, setError] = uS_login('');
  const [loading, setLoading] = uS_login(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.login(email, password);
      if (res?.success && (res?.data?.token?.access_token || res?.data?.access_token)) {
        const meRes = await api.me();
        if (meRes?.success) {
          onLogin(meRes.data);
        } else {
          setError('Gagal mengambil data user');
        }
      } else {
        setError(res?.message || 'Login gagal');
      }
    } catch (err) {
      setError(err.message || 'Email atau password salah');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-bg2 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-[400px]">
        <Card className="p-8">
          <div className="flex justify-center mb-6">
            <Logo size={36} />
          </div>
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-ink dark:text-slate-100">Masuk ke Dashboard</h1>
            <p className="text-sm text-muted mt-1">Kelola donasi & campaign NIATBAIK.ORG</p>
          </div>

          {error && (
            <div className="mb-4 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-900/40 rounded-xl p-3 text-sm text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <Icons.X w={16} h={16} className="shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Email" required>
              <Input
                type="email"
                placeholder="admin@niatbaik.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Icons.Mail w={18} h={18} />}
                required
              />
            </Field>
            <Field label="Password" required>
              <Input
                type="password"
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Icons.Lock w={18} h={18} />}
                required
              />
            </Field>
            <Button
              variant="primary"
              size="lg"
              full
              type="submit"
              disabled={loading}
            >
              {loading ? 'Memproses...' : 'Masuk'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <a href="#" onClick={(e) => { e.preventDefault(); window.__nbNavigateLanding && window.__nbNavigateLanding(); }} className="text-sm text-brand-600 hover:underline font-medium">
              Kembali ke halaman utama
            </a>
          </div>
        </Card>

        <div className="mt-4 text-center text-xs text-muted">
          &copy; 2026 NIATBAIK.ORG — Platform Donasi Pendidikan
        </div>
      </div>
    </div>
  );
}

window.LoginPage = LoginPage;
