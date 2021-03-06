/* Copyright (c) 2011 ActiveState Software Inc.
   See the file LICENSE.txt for licensing information. */

// --------------------------------------------------------------------------------
// debug

	var log = ko.logging.getLogger("pref-jsfl");
	//log.setLevel(ko.logging.LOG_DEBUG);
	//log.setLevel(ko.logging.LOG_INFO);

// --------------------------------------------------------------------------------
// globals

// --------------------------------------------------------------------------------
// functions


	function PrefXJSFL_OnLoad()
	{
		// variables
			getPref('jsflExtraPaths', 'jsflExtraPaths');
			getPref('xjsflPath', 'xjsflPath');

			getBoolPref('xjsflShortcutFile', 'xjsflShortcutFile');
			getBoolPref('xjsflShortcutFile', 'xjsflShortcutDebug');
			getBoolPref('xjsflShortcutProject', 'xjsflShortcutProject');
			getBoolPref('xjsflShortcutLibrary', 'xjsflShortcutLibrary');

		// tree
			/*
			var tree	= document.getElementById("tree-columns");
			var value	= tree.view.getCellText(0, tree.columns.getColumnAt(0));
			//alert(value)
			*/

		// parent pageload handler
			parent.hPrefWindow.onpageload();

	}

	function OnPreferencePageOK()
	{

		for each(var name in ['xjsflShortcutFile', 'xjsflShortcutDebug', 'xjsflShortcutProject', 'xjsflShortcutLibrary'])
		{
			var state =  document.getElementById(name).checked;
			parent.hPrefWindow.prefset.setBooleanPref(name, state);
		}
		return true;
	}


	function getPref(prefName, uiId)
	{
		// variables
			var pref = null;

		// If there is no pref, create it, Otherwise trying to save a new pref will fail,
		// because it tries to get an existing one to see if the pref needs updating.

			//TODO add in switch for different types of property

			if ( ! parent.hPrefWindow.prefset.hasStringPref(prefName) )
			{
				parent.hPrefWindow.prefset.setStringPref(prefName, "");
				pref = '';
			}
			else
			{
				// get the prefs paths
					pref = parent.hPrefWindow.prefset.getStringPref(prefName);
					if (pref == null)
					{
						pref = '';
					}

				// update the UI control
					document.getElementById(uiId).value = pref;
			}

		// return
			return pref;
	}

	function getBoolPref(prefName, uiId)
	{
		// variables
			var pref = null;

		// If there is no pref, create it, Otherwise trying to save a new pref will fail,
		// because it tries to get an existing one to see if the pref needs updating.

			//TODO add in switch for different types of property

			if ( ! parent.hPrefWindow.prefset.hasBooleanPref(prefName) )
			{
				parent.hPrefWindow.prefset.setBooleanPref(prefName, "");
				pref = '';
			}
			else
			{
				// get the prefs paths
					pref = parent.hPrefWindow.prefset.getBooleanPref(prefName);
					if (pref == null)
					{
						pref = '';
					}

				// update the UI control
					document.getElementById(uiId).checked = pref;
			}

		// return
			return pref;
	}

	function setXJSFLPath()
	{
		var textbox     = document.getElementById("xjsflPath");
		var path		= ko.filepicker.getFolder(getDirectoryFromTextObject(textbox), 'Pick the xJSFL installation folder');

		if(path != null)
		{
			// test that the location is valid
				var koFileEx = Components.classes["@activestate.com/koFileEx;1"].createInstance(Components.interfaces.koIFileEx);
				koFileEx.path = path + '/core/jsfl/libraries/xjsfl.jsfl';
				if( ! koFileEx.exists )
				{
					alert('The selected folder is not an xJSFL installation folder');
					return false;
				}

			// assign path
				textbox.value   = path;

			// create libraries path
				var libraries   = path + '/core/jsfl/libraries'
				if(navigator.userAgent.indexOf('Windows') != -1)
				{
					libraries   = libraries.replace(/\//g, '\\');
				};

			// add libraries to patsh if not already there
				var extraPaths  = document.getElementById("jsflExtraPaths");
				if(extraPaths.value.indexOf(libraries) === -1)
				{
					extraPaths.value = libraries + ';' + extraPaths.value;
				}

			// return
				return true;
		}

		return false;
	}
