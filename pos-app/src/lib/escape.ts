/**
 * Escape karakter HTML special untuk mencegah XSS.
 * Gunakan fungsi ini setiap kali menyisipkan data dari DB/user ke dalam HTML string.
 */
export function esc(str: string | number | null | undefined): string {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
