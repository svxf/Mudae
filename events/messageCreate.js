const { Events } = require('discord.js');

module.exports = {
	name: Events.MessageCreate,
	async execute(message) {
		if (message.author.bot) return;

		const prefix = '$';
		if (!message.content.startsWith(prefix)) return;

		const args = message.content.slice(prefix.length).trim().split(/ +/);
		const commandName = args.shift().toLowerCase();

        const command = message.client.messageCommands.get(commandName);

		if (!command) {
			console.error(`no command matching ${commandName} was found.`);
			return;
		}

		try {
			await command.execute(message, args);
		} catch (error) {
			console.error(error);
			await message.reply('there was an error while executing this command!');
		}
	},
};