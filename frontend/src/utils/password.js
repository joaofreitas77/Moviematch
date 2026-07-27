export const passwordRequirements = [
  { label: "8 ou mais caracteres", test: (value) => value.length >= 8 },
  { label: "pelo menos uma letra", test: (value) => /[A-Za-z]/.test(value) },
  { label: "pelo menos um número ou caractere especial", test: (value) => /[^A-Za-z]/.test(value) },
];

export function isPasswordComplex(password) {
  return passwordRequirements.every(({ test }) => test(password));
}
