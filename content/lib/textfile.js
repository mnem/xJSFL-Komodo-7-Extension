/**
 * TextFile object - reads and writes text files to disk
 */
TextFile = function(pathOrURI, content)
{
	// methods
		this.read = function()
		{
			this.koFileEx.open("r");
			var data = this.koFileEx.readfile();
			this.koFileEx.close();
			return data;
		}

		this.write = function(data, append)
		{
			this.koFileEx.open(append ? 'a' : 'w');
			this.koFileEx.puts(data);
			this.koFileEx.close();
			return true
		}

		this.run = function()
		{
			var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
			file.initWithPath(this.koFileEx.path);
			return file.launch();
		}

		this.__defineGetter__('exists', function(){ return this.koFileEx.exists; } );

		this.toString = function()
		{
			return '[function TextFile path="' +this.koFileEx.path+ '"]';
		}

	// constructor
		this.koFileEx		= Components.classes["@activestate.com/koFileEx;1"].createInstance(Components.interfaces.koIFileEx);
		this.koFileEx.path	= ko.uriparse.URIToPath(pathOrURI);

	// variables

	// write to the file if content is supplied
		if(content)
		{
			this.write(content);
		}

	// return
		return this;

}
