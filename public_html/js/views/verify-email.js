const VerifyEmailView = (() => {

    function getParams() {
        const qs = window.location.hash.split('?')[1] || '';
        const p  = new URLSearchParams(qs);
        return { token: p.get('token') || '', change: p.get('change') === '1' };
    }

    async function render(container) {
        const { token, change } = getParams();

        if (!token) {
            container.innerHTML = `
                <div class="card auth-card">
                    <h2>Invalid Link</h2>
                    <p style="color:var(--color-muted);text-align:center;margin-bottom:var(--space);">
                        This verification link is invalid or has expired.
                    </p>
                    <a href="#login" class="btn btn-secondary btn-block">Back to Sign In</a>
                </div>
            `;
            return;
        }

        container.innerHTML = `<div class="card auth-card"><p class="loading" style="text-align:center;">Verifying&hellip;</p></div>`;

        try {
            if (change) {
                await API.auth.verifyEmailChange({ token });
                container.innerHTML = `
                    <div class="card auth-card">
                        <h2>Email Updated</h2>
                        <p style="text-align:center;color:var(--color-muted);margin-bottom:var(--space);">
                            Your email address has been updated.
                        </p>
                        <a href="#login" class="btn btn-primary btn-block">Sign In</a>
                    </div>
                `;
            } else {
                await API.auth.verifyEmail({ token });
                container.innerHTML = `
                    <div class="card auth-card">
                        <h2>Email Verified</h2>
                        <p style="text-align:center;color:var(--color-muted);margin-bottom:var(--space);">
                            Your email has been verified. You can now sign in.
                        </p>
                        <a href="#login" class="btn btn-primary btn-block">Sign In</a>
                    </div>
                `;
            }
        } catch (ex) {
            container.innerHTML = `
                <div class="card auth-card">
                    <h2>Verification Failed</h2>
                    <p style="color:var(--color-muted);text-align:center;margin-bottom:var(--space);">
                        ${String(ex.message).replace(/&/g,'&amp;').replace(/</g,'&lt;')}
                    </p>
                    <a href="#login" class="btn btn-secondary btn-block">Back to Sign In</a>
                </div>
            `;
        }
    }

    return { render };
})();
