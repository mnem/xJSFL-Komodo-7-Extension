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
		this.koFileEx = Components.classes["@activestate.com/koFileEx;1"].createInstance(Components.interfaces.koIFileEx);
		this.koFileEx[ pathOrURI.indexOf('file:///')  == 0 ? 'URI' : 'path'] = pathOrURI;

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
			get:function(name)
			{
				if (xjsfl.objects.prefs.hasStringPref(name))
				{
					return xjsfl.objects.prefs.getStringPref(name);
				};
				return null;
			},

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
			 * Auto-size code completion items box
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
			 */
			get current()
			{
				return ko.views.manager.currentView;
			},

			/**
			 * Get all the views in the correct order, so the first tab can be run
			 * @returns {Array}
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
			 */
			run:function(pathOrURI)
			{
				var file	= xjsfl.objects.localFile;
				file.initWithPath(ko.uriparse.URIToPath(pathOrURI));
				file.launch();
				file.exists
			},

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
			 * Runs the uri using the xJSFL file/exec load process
			 */
			run: function(uri, type)
			{
				//alert('about to ' +type+ ':' + uri)

				// get root
					var root		= xjsfl.prefs.get('xjsflPath');
					if(root)
					{
						// xJSFL root URI
							var xjsflURI	= xjsfl.jsfl.getURI(root);

						// commands
							var runURI		= xjsflURI + '/core/jsfl/run/' +type+ '.jsfl';
							var fileURI		= xjsflURI + '/core/jsfl/run/uri.jsfl';
							var fileJSFL	= 'uri = "' +uri+ '";';

						// check run file exists
							if(xjsfl.file.exists(runURI))
							{
								// write the URI to the uri file
									new TextFile(fileURI).write(fileJSFL);

								// run the run file
									xjsfl.file.run(runURI);

								// returnas
									return true;
							}
					}

				// alert user
					alert('The file(s) cannot be executed as the xJSFL installation path is not set in Preferences.\n\nGo to Preferences > Languages > JSFL to set the path.');

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
					var uri		= view.koDoc.file.URI;
					var saved	= xjsfl.views.save(view)

				// variables
					if(saved)
					{
						// check for XUL dialog
							if(/\.(xml|xul)$/.test(uri))
							{
								if(/<dialog\b/.test(view.scimoz.text))
								{
									xjsfl.jsfl.run(uri, 'xul');
								}
								return true;
							}

						// otherwise, just run the file
							xjsfl.file.run(uri);
					}
				try
				{
				}
				catch(err)
				{
					alert('File not yet saved');
				}

			},

			runProject:function()
			{
				// get ordered views
					var views 		= xjsfl.views.all;
					var firstView	= null;

				// loop through and save, grabbing first JSFL document
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