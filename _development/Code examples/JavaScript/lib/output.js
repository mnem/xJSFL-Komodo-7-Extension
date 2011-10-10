Output =
{
	/**
	 * Prints the data to the printer
	 * @param	{Object}	data	Some data
	 * @returns	{Boolean}			Whether the data printed successfully
	 */
	print:function(data)
	{
		return true;
	},

	/**
	 * Saves the data to disk
	 * @param	{Object}	data	Some data
	 * @returns	{Boolean}			Whether the data printed successfully
	 */
	save:function(data)
	{
		return true;
	},

	/**
	 * Copies the current selection
	 * @returns	{String}			A string of data
	 */
	copy:function()
	{
		return 'Some data you copied';
	},

	/**
	 * Pastes whatever's in the clipboard
	 * @returns	{Number}			The length of the data in the clipboard
	 */
	paste:function()
	{
		return String(data).length;
	}

}