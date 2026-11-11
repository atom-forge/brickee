// LaTeX -> MathML with Temml (browsers render MathML natively; it also runs on the server). Untrusted input: Temml's
// `trust: false` keeps commands such as \href out, and a malformed formula gives an error note instead of throwing.
import temml from 'temml';

export function tex(source: string, display: boolean): string {
	try {
		return temml.renderToString(source, { displayMode: display, throwOnError: false, trust: false });
	} catch {
		return '';
	}
}
