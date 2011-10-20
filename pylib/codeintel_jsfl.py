#!/usr/bin/env python
# ***** BEGIN LICENSE BLOCK *****
# Version: MPL 1.1/GPL 2.0/LGPL 2.1
#
# The contents of this file are subject to the Mozilla Public License
# Version 1.1 (the "License"); you may not use this file except in
# compliance with the License. You may obtain a copy of the License at
# http://www.mozilla.org/MPL/
#
# Software distributed under the License is distributed on an "AS IS"
# basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. See the
# License for the specific language governing rights and limitations
# under the License.
#
# The Original Code is Komodo code.
#
# The Initial Developer of the Original Code is ActiveState Software Inc.
# Portions created by ActiveState Software Inc are Copyright (C) 2010-2011
# ActiveState Software Inc. All Rights Reserved.
#
# Contributor(s):
#   ActiveState Software Inc
#
# Alternatively, the contents of this file may be used under the terms of
# either the GNU General Public License Version 2 or later (the "GPL"), or
# the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
# in which case the provisions of the GPL or the LGPL are applicable instead
# of those above. If you wish to allow use of your version of this file only
# under the terms of either the GPL or the LGPL, and not to allow others to
# use your version of this file under the terms of the MPL, indicate your
# decision by deleting the provisions above and replace them with the notice
# and other provisions required by the GPL or the LGPL. If you do not delete
# the provisions above, a recipient may use your version of this file under
# the terms of any one of the MPL, the GPL or the LGPL.
#
# ***** END LICENSE BLOCK *****

"""JSFL support for CodeIntel"""

import logging

#from codeintel2.util import makePerformantLogger  # Komodo 7
from codeintel2.lang_javascript import (JavaScriptLexer,
                                        JavaScriptLangIntel,
                                        JavaScriptBuffer,
                                        JavaScriptImportHandler,
                                        JavaScriptCILEDriver)

#---- globals

lang = "JSFL"
log = logging.getLogger("codeintel.jsfl")
log.setLevel(logging.DEBUG)
#makePerformantLogger(log)  # Komodo 7

#---- language support

class JSFLLexer(JavaScriptLexer):
    lang = lang
    def __init__(self, mgr):
        JavaScriptLexer.__init__(self, mgr)

class JSFLLangIntel(JavaScriptLangIntel):
    lang = lang

    # add extra paths for codeintel
    extraPathsPrefName = "jsflExtraPaths"

    log.info('TEST BY DAVE')

    # Tell the codeintel database that JSFL completions will use all known jsfl files.
    def __init__(self, *args, **kwargs):
        JavaScriptLangIntel.__init__(self, *args, **kwargs)
        if lang not in self.mgr.db.import_everything_langs:
            self.mgr.db.import_everything_langs.add(lang)

    # Customize the standard library used for JSFL - use the JSFL catalog.
    @property
    def stdlibs(self):
        catalog_lib = self.mgr.db.get_catalog_lib(lang, ["jsfl"])
        js_lib = self.mgr.db.get_stdlib('JavaScript')
        return [catalog_lib, js_lib]

class JSFLBuffer(JavaScriptBuffer):
    lang = lang

class JSFLImportHandler(JavaScriptImportHandler):
    def find_importables_in_dir(self, dir):
        """See citadel.py::ImportHandler.find_importables_in_dir() for
        details.

        Importables for JavaScript look like this:
            {"foo.js":  ("foo.js", None, False),
             "somedir": (None,     None, True)}

        TODO: log the fs-stat'ing a la codeintel.db logging.
        """
        from os.path import join, isdir, splitext
        import os
        if dir == "<Unsaved>":
            #TODO: stop these getting in here.
            return {}

        #TODO: log the fs-stat'ing a la codeintel.db logging.
        try:
            names = os.listdir(dir)
        except OSError, ex:
            return {}
        dirs, nondirs = set(), set()
        for name in names:
            try:
                if isdir(join(dir, name)):
                    dirs.add(name)
                else:
                    nondirs.add(name)
            except UnicodeDecodeError:
                # Hit a filename that cannot be encoded in the default encoding.
                # Just skip it. (Bug 82268)
                pass

        importables = {}
        for name in nondirs:
            base, ext = splitext(name)
            if ext != ".jsfl":
                continue
            if base in dirs:
                importables[base] = (name, None, True)
                dirs.remove(base)
            else:
                importables[base] = (name, None, False)
        for name in dirs:
            importables[name] = (None, None, True)

        return importables

class JSFLCILEDriver(JavaScriptCILEDriver):
    lang = lang

    def __init__(self, *args, **kwargs):
        JavaScriptCILEDriver.__init__(self, *args, **kwargs)

#---- registration

def register(mgr):
    """Register language support with the Manager."""
    mgr.set_lang_info(lang,
                      silvercity_lexer=JSFLLexer(mgr),
                      buf_class=JSFLBuffer,
                      langintel_class=JSFLLangIntel,
                      import_handler_class=JSFLImportHandler,
                      cile_driver_class=JSFLCILEDriver,
                      is_cpln_lang=True)
