const { SlashCommandBuilder } = require('discord.js');
const { readCsv } = require('../../helper');
const { stringify } = require('csv-stringify/sync');

const path = require('path');
const fs = require('fs');

module.exports = {
	category: 'mudae',
	data: new SlashCommandBuilder()
		.setName('remove_character')
		.setDescription('remove a character either from the customCharacters or normal characters database')
        .addStringOption(option =>
            option.setName('character')
            .setDescription('character name')
            .setRequired(true))
        .addBooleanOption(option =>
            option.setName('custom')
            .setDescription('is the character in the customCharacters database')
            .setRequired(true)),
	async execute(interaction) {
        const characterName  = interaction.options.getString('character');
        const isCustom = interaction.options.getBoolean('custom');

        const databasePath = isCustom
            ? path.join(__dirname, 'data/custom_characters.csv')
            : path.join(__dirname, 'data/characters.csv');

        try {
            let characters = await readCsv(databasePath);
            const characterIndex = characters.findIndex(c => c.Name.toLowerCase() === characterName);

            if (characterIndex !== -1) {
                characters.splice(characterIndex, 1);

                const updatedCsv = stringify(characters, { header: true });
                fs.writeFileSync(databasePath, updatedCsv);

                await interaction.reply(`the character "${characterName}" has been removed from the ${isCustom ? 'custom' : 'normal'} database.`);
            } else {
                await interaction.reply(`the character "${characterName}" was not found in the ${isCustom ? 'custom' : 'normal'} database.`);
            }
        } catch (error) {
            console.error('error updating character database:', error);
            await interaction.reply('an error occurred while removing the character.');
        }
	},
};