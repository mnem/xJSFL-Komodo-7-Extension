
/**
 * A basic person class
 * @param	{String}	name	The person's name
 * @param	{Number}	age		The person's age
 * @returns	{Person}			A new Person object
 */
function Person(name, age)
{
	this.name	= name;
	this.age	= age;
}

Person.prototype =
{
	name:'',

	age:0,

	/**
	 * Gets the person's birthday
	 * @returns	{Date}		A date object
	 */
	getBirthday:function()
	{
		var date = new Date()
		return date.setYear(date.getFullYear() - this.age);
	},

	/**
	 * Returns a string representation of the person
	 * @returns	{String}		The person's name and age
	 */
	toString:function()
	{
		return 'Person: "' + this.name + '" (' +this.age+ ')';
	}
}