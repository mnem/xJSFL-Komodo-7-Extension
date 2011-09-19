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

/**
 * xjsfl - library of functions needed to publish JSFL files
 */
xjsfl =
{

	// --------------------------------------------------------------------------------
	// onLoad

		onLoad:function(event)
		{
			//commandOutput('> xJSFL: initialised');
			window.addEventListener('current_view_changed', xjsfl.tools.resizeAutocomplete, false);
			window.addEventListener('view_opened ', xjsfl.tools.resizeAutocomplete, false);
		},

	// --------------------------------------------------------------------------------
	// onLoad

		objects:
		{
			json:		Components.classes["@mozilla.org/dom/json;1"].createInstance(Components.interfaces.nsIJSON),
			prefs:		Components.classes['@activestate.com/koPrefService;1'].getService(Components.interfaces.koIPrefService).prefs,
			file:		Components.classes["@activestate.com/koFileEx;1"].createInstance(Components.interfaces.koIFileEx),
			localFile:	Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile),
			clipboard:	Components.classes["@mozilla.org/widget/clipboardhelper;1"].getService(Components.interfaces.nsIClipboardHelper)
		},


	// --------------------------------------------------------------------------------
	// prefs

		prefs:
		{
			/**
			 * Gets a string preference
			 * @param	{String}	name
			 * @returns	{String}
			 */
			get:function(name)
			{
				if (xjsfl.objects.prefs.hasStringPref(name))
				{
					return xjsfl.objects.prefs.getStringPref(name);
				};
				return null;
			},

			/**
			 * Sets a string preference
			 * @param	{String}	name
			 * @param	{String}	value
			 * @returns	{Boolean}
			 */
			set:function(name, value)
			{
				return xjsfl.objects.prefs.setStringPref(name, value);
			}

		},


	// --------------------------------------------------------------------------------
	// tools

		tools:
		{
			/**
			 * Copies the current file path to the clipboard in JSFL URI format
			 */
			copyViewURI:function ()
			{
				var uri = xjsfl.jsfl.getURI(ko.views.manager.currentView.koDoc.file.URI);
				xjsfl.objects.clipboard.copyString("'" + uri + "'");
			},

			/**
			 * Sets the size of the code completion items box to 20
			 */
			resizeAutocomplete:function()
			{
				var view = ko.views.manager.currentView;
				if (view && view.scimoz)
				{
					view.scimoz.autoCMaxHeight = 20;
				}
			}

		},


	// --------------------------------------------------------------------------------
	// views

		views:
		{
			/**
			 * Get the current view;
			 * @returns		{View}
			 */
			get current()
			{
				return ko.views.manager.currentView;
			},

			/**
			 * Get all the views in the correct order, so the first tab can be run
			 * @returns {Array}	An array of all open Komodo views
			 */
			get all()
			{
				// get tabbox, tabs and panels

					// view
						var view = ko.views.manager.currentView;

					// tabbox
						var tabbox = view.parentNode;
						while (tabbox && tabbox.nodeName != "tabbox" && tabbox.nodeName != "xul:tabbox")
						{
							tabbox = tabbox.parentNode;
						}

					// tabs and panels
						var tabs		= tabbox._tabs.childNodes
						var tabpanels	= tabbox._tabpanels.childNodes


				// get views and tabs in the correct order

					// views
						var views = {};
						for (var i = 0;  i < tabpanels.length; i++)
						{
							var panel = tabpanels[i];
							views[panel.id] = panel.firstChild;
						}

					// tabs
						var orderedViews = [];
						for(var i = 0; i < tabs.length; i++)
						{
							var tab = tabs[i];
							var view = views[tab.linkedPanel];
							if(view && view.koDoc)
							{
								orderedViews.push(view);
							}
						}

				// return
					return orderedViews;
			},

			/**
			 * Saves the view, and prompts for a new filename if not yet saved
			 * @param	{View}	view	A Komodo view
			 * @returns	{Boolean}			A boolean indicating if the file was successfully saved or not
			 */
			save:function(view)
			{
				// variables
					var doc		= view.koDoc;
					var file	= doc.file;
					var saved	= false;

				// save a new document if unsaved or new
					if(file == null || doc.isUntitled)
					{
						if(view.saveAs())
						{
							saved = true;
						}
					}

				// otherwise, attempt to save existing document
					else
					{
						if(doc.isDirty)
						{
							try{doc.save(true);saved = true;}
							catch(err){saved = false;}
						}
						else
						{
							saved = true;
						}
					}

				// return
					return saved;
			}


		},


	// --------------------------------------------------------------------------------
	// file

		file:
		{
			/**
			 * Runs a file or URI using the local filesystem
			 * @param	{String}	pathOrURI
			 */
			run:function(pathOrURI)
			{
				var file	= xjsfl.objects.localFile;
				file.initWithPath(ko.uriparse.URIToPath(pathOrURI));
				file.launch();
			},

			/**
			 * Shortcut function to determine if a file exists
			 * @param	{String}	pathOrURI	The path or URI of the file
			 * @returns	{Boolean}				true / false
			 */
			exists:function(pathOrURI)
			{
				var file	= xjsfl.objects.file;
				file.path	= ko.uriparse.URIToPath(pathOrURI)
				return file.exists;
			}

		},


		jsfl:
		{
			/**
			 * Grabs the JSFL native URI format: file:///c|path/to/file.jsfl
			 * @param	{String}	pathOrURI	A path or uri
			 * @returns	{String}				A JSFL native URI
			 */
			getURI:function(pathOrURI)
			{
				return ko.uriparse.pathToURI(pathOrURI).replace(/\/(\w):/, '/$1|');
			},

			/**
			 * Runs a JSFL file via the xJSFL file/run load process
			 *
			 * 1 - Saves the URI of the file to run to a text file
			 * 2 - launches the run/<type>.jsfl file
			 * 3 - that file reads in the URI and does something with it
			 *
			 * @param	{String}	uri		The URI of the file to run
			 * @param	{String}	type	The type of file to run; valid values are "lib" or "xul"
			 */
			run: function(uri, type)
			{
				// get xjsflPath
					var xjsflPath = xjsfl.prefs.get('xjsflPath');

				// run the file if root xjsflPath is defined...
					if(xjsflPath)
					{
						// xJSFL root URI
							var xjsflURI	= xjsfl.jsfl.getURI(xjsflPath);

						// commands
							var jsflURI		= xjsflURI + '/core/jsfl/run/' +type+ '.jsfl';
							var textURI		= xjsflURI + '/core/jsfl/run/uri.txt';

						// check run file exists
							if(xjsfl.file.exists(jsflURI))
							{
								// write the URI to the text file
									new TextFile(textURI).write(uri);

								// run the run file
									xjsfl.file.run(jsflURI);

								// return
									return true;
							}
					}

				// ...if not, throw the user back to preferences
					alert('The file(s) cannot be executed as the xJSFL installation path is not set in Preferences.\n\nGo to Preferences > Languages > JSFL > xJSFL to set the path.');
					return false;
			}

		},

	// --------------------------------------------------------------------------------
	// file

		shortcuts:
		{
			runFile:function()
			{
				// variables
					var view	= ko.views.manager.currentView;
					var saved	= xjsfl.views.save(view)

				// variables
					if(saved)
					{
						// variables
							var uri		= view.koDoc.file.URI;

						// check for XUL dialog
							if(/\.(xml|xul)$/.test(uri))
							{
								if(/<dialog\b/.test(view.scimoz.text))
								{
									xjsfl.jsfl.run(uri, 'xul');
								}
							}

						// otherwise, just run the file
							else
							{
								xjsfl.file.run(uri);
							}
					}
			},

			runProject:function()
			{
				// get ordered views
					var views 		= xjsfl.views.all;
					var firstView	= null;

				// loop through views and save, grabbing first JSFL document
					for(var i = 0; i < views.length; i++)
					{
						// save document
							var view = views[i];
							xjsfl.views.save(view);

						// grab first document
							if(firstView == null && /\.jsfl$/.test(view.koDoc.file.URI))
							{
								firstView = view;
							}

					}

				// run the first view
					if(firstView)
					{
						xjsfl.file.run(firstView.koDoc.file.URI);
					}
					else
					{
						alert('Cannot run xJSFL project!\n\nAt least one tab needs to be a .jsfl file');
					}
			},

			runScriptOnSelectedLibraryItems:function()
			{
				// variables
					var view	= ko.views.manager.currentView;
					var saved	= xjsfl.views.save(view)

				// variables
					if(saved && /.jsfl$/.test(view.koDoc.file.URI))
					{
						xjsfl.jsfl.run(view.koDoc.file.URI, 'lib');
					}
			}

		}
}

window.addEventListener("load", xjsfl.onLoad, false);