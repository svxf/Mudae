const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { readCsv, getRandomColor } = require('../../helper')

const path = require('path');

module.exports = {
	category: 'mudae',
	data: new SlashCommandBuilder()
		.setName('check_character')
		.setDescription('shows you a preview of a character')
        .addStringOption(option =>
            option.setName('character')
                .setDescription('character name')
                .setRequired(true)),
	async execute(interaction) {
		const charName = interaction.options.getString('character').toLowerCase();
        const charactersDatabase = path.join(__dirname, 'data/characters.csv');
        const customCharactersDatabase = path.join(__dirname, 'data/custom_characters.csv');

        try {
            let characters = await readCsv(charactersDatabase);
            let character = characters.find(c => c.Name.toLowerCase() === charName);
            
            if (!character) {
                characters = await readCsv(customCharactersDatabase);
                character = characters.find(c => c.Name.toLowerCase() === charName);
            }

            if (character) {
                // check if it was claimed
                const userDatabase = path.join(__dirname, 'data/users.csv');
                const users = await readCsv(userDatabase);

                const allClaimedCharacters = users.flatMap(user => JSON.parse(user.claimedCharacters || "[]"));
                const claimedCharacter = allClaimedCharacters.find(c => c.characterName.toLowerCase() === charName);
                let footerText = null;
                if (claimedCharacter) {
                    footerText = `Claimed by ${claimedCharacter.userName}`;
                }

                const embed = new EmbedBuilder()
                .setTitle(character.Name)
                .setImage(character.PFP)
                .addFields(
                    { name: 'Rank', value: `${character.Rank ? `#${character.Rank}` : 'Custom Character'}`, inline: true },
                    { name: 'Age', value: `${character.Age}`, inline: true }
                )
                .setColor(getRandomColor())
                .setFooter({ text: footerText });
            
                await interaction.reply({ embeds: [embed] });
            } else {
                await interaction.reply(`${charName} was not found.`);
            }
        } catch (error) {
            console.error('error reading the database:', error);
            await interaction.reply('an error occurred while searching for the character.');
        }
	},
};