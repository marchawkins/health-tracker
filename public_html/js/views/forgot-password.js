const ForgotPasswordView = (() => {


    async function render(container) {
        container.innerHTML = `
            <div class="card auth-card">
                <h2>Reset Password</h2>
                <p style="color:var(--color-muted);font-size:14px;margin-bottom:var(--space);">
                    Enter your email address and we'll send you a link to reset your password.
                </p>
                <form id="forgot-form" novalidate>
                    <div class="form-row">
                        <label for="forgot-email">Email</label>
                        <input type="email" id="forgot-email" name="email"
                               autocomplete="email" inputmode="email" required>
                    </div>
                    <div id="forgot-error" class="error" style="display:none;margin-bottom:12px;"></div>
                    <button type="submit" class="btn btn-primary btn-block">Send Reset Link</button>
                </form>
                <div class="auth-links">
                    <a href="#login">Back to Sign In</a>
                </div>
            </div>
        `;

        document.getElementById('forgot-email').focus();

        document.getElementById('forgot-form').addEventListener('submit', async e => {
            e.preventDefault();
            const form = e.target;
            const btn  = form.querySelector('[type="submit"]');
            const err  = document.getElementById('forgot-error');
            err.style.display = 'none';
            btn.disabled    = true;
            btn.textContent = 'Sending…';

            try {
                await API.auth.forgotPassword({ email: form.email.value.trim() });
                const main = document.getElementById('app-main');
                main.innerHTML = `
                    <div class="card auth-card">
                        <h2>Check Your Email</h2>
                        <p style="text-align:center;color:var(--color-muted);margin-bottom:var(--space);">
                            If <strong>${escHtml(form.email.value.trim())}</strong> is registered,
                            you'll receive a password reset link shortly.
                        </p>
                        <a href="#login" class="btn btn-secondary btn-block">Back to Sign In</a>
                    </div>
                `;
            } catch (ex) {
                err.textContent   = escHtml(ex.message);
                err.style.display = 'block';
                btn.disabled    = false;
                btn.textContent = 'Send Reset Link';
            }
        });
    }

    return { render };
})();
