export function URLEncodedUTF8(base_url: string, params: object) {
	let url_encoded = base_url;

	for (let [key, value] of Object.entries(params)) {
		url_encoded += key + '=' + value;
		if (key !== Object.keys(params).pop())
			url_encoded += '&';
	}
	return url_encoded;
}
