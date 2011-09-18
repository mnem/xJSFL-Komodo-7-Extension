function Test(x)
{
    this.x = x;
    this.toString = function()
    {
        return '[object Test x="' +x+'"]';
    }
}

var test = new Test(5)

fl.trace(test);




