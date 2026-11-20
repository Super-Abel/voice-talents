export function TotpCodeInput() {
  return (
    <div>
      <label htmlFor="code" className="field-label">
        Code à 6 chiffres
      </label>
      <input
        id="code"
        name="code"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9 ]{6,7}"
        maxLength={7}
        required
        className="field-input text-center font-mono text-2xl tracking-[0.4em]"
      />
    </div>
  );
}
