import polka from 'polka';

const json = (res, data) => {
	res.writeHead(200, { 'Content-Type': 'application/json' });
	res.end(JSON.stringify(data));
};

polka()
	.get('/', (req, res) => {
		json(res, { hello: 'world' });
	})
	.listen(process.env.PORT, () => {
		console.log(`Running on port ${process.env.PORT}`);
	});
