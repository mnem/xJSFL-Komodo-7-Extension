/**
 * xjsfl - library of functions needed to publish JSFL files
 */
xjsfl =
{

	// --------------------------------------------------------------------------------
	// onLoad

		
	// ----------------------------------------------------------------------------------------------------
	// Events

		events:
		{
			
			onLoad:function(event)
			{
				// debug
					//commandOutput('> xJSFL: initialised');
	
				// auto-size autocomplete box
					window.addEventListener('current_view_changed', xjsfl.tools.resizeAutocomplete, false);
					
				// set states
					xjsfl.shortcuts.states.file		= xjsfl.prefs.getBool('xjsflShortcutFile');
					xjsfl.shortcuts.states.project	= xjsfl.prefs.getBool('xjsflShortcutProject');
					xjsfl.shortcuts.states.library	= xjsfl.prefs.getBool('xjsflShortcutLibrary');
					
				// add listener if keyboard shortcuts are required
					if(xjsfl.shortcuts.states.file || xjsfl.shortcuts.states.project || xjsfl.shortcuts.states.library)
					{
						xjsfl.events.add();
					}
			},
			
			add:function(type, scope, handler)
			{
				this.remove();
				ko.views.manager.topView.addEventListener('keypress', this.onKeyPress, true);
			},

			remove:function(type, scope, handler)
			{
				if (autocode && autocode.onKeyPress)
				{
					ko.views.manager.topView.removeEventListener('keypress', this.onKeyPress, true);
				}
			},

			onKeyPress:function(event)
			{
				// Only trap when ENTER pressed
				if (event.keyCode === 13)
				{
					// flag state
						var state = false;
						
					// test
						if(event.altKey && event.shiftKey && event.ctrlKey)
						{
							if(xjsfl.shortcuts.states.library)
							{
								state = xjsfl.shortcuts.runScriptOnSelectedLibraryItems();
							}
						}
						else if(event.shiftKey && event.ctrlKey)
						{
							if(xjsfl.shortcuts.states.project)
							{
								state = xjsfl.shortcuts.runProject();
							}
						}
						else if(event.ctrlKey)
						{
							if(xjsfl.shortcuts.states.file)
							{
								state = xjsfl.shortcuts.runFile();
							}
						}
						
					// cancel if macros exeute
						if(state)
						{
							event.preventDefault();
							event.stopPropagation();
							return true;
						}
				}
			}
			
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
			},
			
			getBool:function(name)
			{
				if (xjsfl.objects.prefs.hasBooleanPref(name))
				{
					return xjsfl.objects.prefs.getBooleanPref(name);
				};
				return false;
			},

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
			resizeAutocomplete:function(event)
			{
				var view = event.originalTarget;
				//var view = ko.views.manager.currentView;
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
			
			read:function(pathOrURI)
			{
				var file	= Components.classes["@activestate.com/koFileEx;1"].createInstance(Components.interfaces.koIFileEx);
				file.path	= ko.uriparse.URIToPath(pathOrURI);
				if(file.exists)
				{
					file.open('r');
					var str = file.readfile();
					file.close();
					return str;
				}
				return null;
			},

			/**
			 * Shortcut function to determine if a file exists
			 * @param	{String}	pathOrURI	The path or URI of the file
			 * @returns	{Boolean}				true / false
			 */
			exists:function(pathOrURI)
			{
				var file	= xjsfl.objects.file;
				file.path	= ko.uriparse.URIToPath(pathOrURI);
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
							var jsflURI		= xjsflURI + '/core/run/' +type+ '.jsfl';
							var textURI		= xjsflURI + '/core/temp/uri.txt';

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
					alert('This macro needs to know the location of your xJSFL installation folder in order to run.\n\nPlease go to Preferences > xJSFL and update the path.');
					ko.commands.doCommand('cmd_editPrefs')
					return false;
			},

			/**
			 * Tests a JSFL file, then attempts to read in any catched errors and open the file to the correct line
			 * 
			 * @param		{String}		uri		The URI of teh file to test
			 */
			test:function(uri)
			{
				// get xjsflPath
					var xjsflPath = xjsfl.prefs.get('xjsflPath');
					
				// run the file first
					if(this.run(uri, 'try'))
					{
						function test()
						{
							// variables
								var xjsflURI	= xjsfl.jsfl.getURI(xjsflPath);
								var errorURI	= xjsflURI + '/core/temp/errors.txt'
								var error		= xjsfl.file.read(errorURI);
								
							// do something with errors
								if(error)
								{
									// variables
										error			= error.split(/[\r\n]+/);
										var uri			= error[0];
										var path		= ko.uriparse.URIToPath(uri);
										var line		= error[1];
										var name		= error[2];
										var message		= error[3];
												
									// message
										var str			= 'The following JavaScript error occurred, at line ' +line+ ' of file "' +uri.split('/').pop()+ '":\n\n';
										str				+= name + ': ' + message.replace(/'/g, '\'') + '\n';
										
									// messages
										ko.open.URIAtLine(uri, line);
										if(window['autocode'])
										{
											autocode.console.trace('\n' + str);
										}
										else
										{
										}
											alert(str);
								}
						}
						// set a small timeout for the error
						setTimeout(test, 500);
					}
			},

		},
		
	// --------------------------------------------------------------------------------
	// file

		shortcuts:
		{
			states:
			{
				file:		false,
				project:	false,
				library:	false,
			},
			
			runFile:function()
			{
				// variables
					var view	= ko.views.manager.currentView;
					var uri		= view.item.url;
					
				// execute XUL or JSFL files only
					if(/\.(jsfl|xul)$/.test(uri))
					{
						var saved = xjsfl.views.save(view);
						if(saved)
						{
							// check for XUL dialog
								if(/\.(|xul)$/.test(uri))
								{
									if(/<dialog\b/.test(view.scimoz.text))
									{
										ko.statusBar.AddMessage('Previewing XUL dialog...', 'xJSFL', 1000);
										xjsfl.jsfl.run(uri, 'xul');
										return true;
									}
								}
								
							// otherwise, run JSFL file
								else
								{
									ko.statusBar.AddMessage('Running JSFL script...', 'xJSFL', 1000);
									xjsfl.file.run(uri);
									return true;
								}
						}
					}
					
				// return
					return false;
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
						ko.statusBar.AddMessage('Running xJSFL project...', 'xJSFL', 1000);
						xjsfl.file.run(firstView.koDoc.file.URI);
						return true;
					}
					else
					{
						ko.statusBar.AddMessage('Cannot run xJSFL project! At least one tab needs to be a .jsfl file', 'xJSFL', 1000, true);
					}
					
				// return
					return false;
			},

			runScriptOnSelectedLibraryItems:function()
			{
				// variables
					var view	= ko.views.manager.currentView;
					var saved	= xjsfl.views.save(view)

				// variables
					if(saved && /.jsfl$/.test(view.koDoc.file.URI))
					{
						ko.statusBar.AddMessage('Running JSFL script on selected librray items...', 'xJSFL', 1000);
						xjsfl.jsfl.run(view.koDoc.file.URI, 'lib');
						return true;
					}
					
				// return
					return false;
			}

		}
}

window.addEventListener("load", xjsfl.events.onLoad, false);