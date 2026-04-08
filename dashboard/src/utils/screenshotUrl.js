import { API_BASE_URL } from '../services/api';

/**
 * Converts a backend filesystem path to a browser URL under /screenshots/.
 * Safe for null/undefined/empty; supports Windows backslashes and Unix slashes.
 */
export function getImageUrl(path) {
	if (!path) {
		return null;
	}
	let trimmed = String(path).trim();
	if (!trimmed) {
		return null;
	}
	if (/^https?:\/\//i.test(trimmed)) {
		try {
			const parsed = new URL(trimmed);
			trimmed = decodeURIComponent(parsed.pathname || '');
		} catch {
			// Fall back to original string parsing below.
		}
	}
	const fileName = trimmed.split(/[/\\]/).filter(Boolean).pop();
	if (!fileName) {
		return null;
	}
	return `${API_BASE_URL}/api/screenshots?name=${encodeURIComponent(fileName)}`;
}

/** @deprecated use getImageUrl */
export const screenshotPathToUrl = getImageUrl;
