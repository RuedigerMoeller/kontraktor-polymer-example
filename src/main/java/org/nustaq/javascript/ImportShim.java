package org.nustaq.javascript;

import org.jsoup.Jsoup;
import org.jsoup.nodes.*;
import org.jsoup.parser.Tag;
import org.jsoup.select.Elements;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;

/**
 * Created by ruedi on 16/07/15.
 */
public class ImportShim {

    boolean inlineCss = true;
    boolean inlineScripts = true;

    public Element shimImports(File htmlFile, String baseUrl, File outputDir, HashSet<String> visited, List<List<Node>> bodyContent ) throws IOException {
        boolean isTop = false;
        if ( bodyContent == null ) {
            isTop = true;
            bodyContent = new ArrayList<>();
        }
        if ( visited.contains(htmlFile.getCanonicalPath()) )
            return null;//new Element(Tag.valueOf("span"),"").html("<!-- "+htmlFile.getName()+"-->");
        visited.add(htmlFile.getCanonicalPath());
        String compName = htmlFile.getName().substring(0, htmlFile.getName().length() - ".html".length());
        Document doc = Jsoup.parse(htmlFile, "UTF-8", baseUrl);

        List<Runnable> changes = new ArrayList<>();
        Elements links = doc.getElementsByTag("link");
        if ( "paper-slider".equals(compName)) {
            int debug = 1;
        }
        for (int i = 0; i < links.size(); i++) {
            Element link = links.get(i);
            //if (link.parent().tagName().equals("head") || true)
            {
                String rel = link.attr("rel");
                String type = link.attr("type");
                if ( "import".equals(rel) ) {
                    if ( type == null || type.length() == 0 ) {
                        String href = link.attr("href");
                        if ( href == null || href.length() == 0 ) {
                            type ="";
                        } else {
                            type = href.substring(href.lastIndexOf('.')+1);
                        }
                    }
                }
                if ("import".equals(rel) ) {
                    if ( type.indexOf("html") >= 0 ) {
                        String href = link.attr("href");
                        if ( !href.startsWith("http") ) {
                            try {
                                File impFi = new File(htmlFile.getParent() + "/" + href);
                                Element imp = shimImports(impFi, baseUrl, outputDir, visited, bodyContent);
                                if (imp instanceof Document) {
                                    imp.getElementsByTag("head").forEach(node -> {
                                        List<Node> children = new ArrayList<>(node.children());
                                        // children.add(0, new Comment(" == "+impFi.getName()+" == ",""));
                                        changes.add(() -> {
                                            Integer integer = link.elementSiblingIndex();
                                            link.parent().insertChildren(integer, children);
                                        });
                                    });
                                    final List<List<Node>> finalBodyContent = bodyContent;
                                    imp.getElementsByTag("body").forEach(node -> {
                                        finalBodyContent.add(new ArrayList<>(node.children()));
                                    });
                                    changes.add( () -> link.remove() );
                                } else {
                                    if ( imp == null ) {
                                        changes.add(() -> link.remove() );
                                    }
                                    else {
                                        final Element finalImp = imp;
                                        changes.add(() -> link.replaceWith(finalImp) );
                                    }
                                }
                            } catch (IOException e) {
                                e.printStackTrace();
                            }
                        }
                    } else if ( inlineCss && ("stylesheet".equals(type) || "css".equals(type)) ) {
                        String href = link.attr("href");
                        if ( href != null && ! href.startsWith("http") ) {
                            File impFi = new File(htmlFile.getParent() + "/" + href);
                            if ( impFi.exists() ) {
                                String canonicalPath = impFi.getCanonicalPath();
                                if ( visited.contains(canonicalPath) ) {
                                    link.remove();
                                } else {
                                    visited.add(canonicalPath);
                                    Element style = new Element(Tag.valueOf("style"), "" );
                                    byte[] bytes = Files.readAllBytes(impFi.toPath());
                                    style.appendChild( new DataNode(new String(bytes,"UTF-8"),"") );
                                    link.replaceWith(style);
                                }
                            }
                        }
                    }
                } // import link
            }
        }
        changes.forEach( change -> change.run() );
        if ( isTop ) {
            Element body = doc.getElementsByTag("body").first();
            Element div = new Element(Tag.valueOf("div"),"");
            div.attr("hidden","");
            div.attr("by-vulcanize","");
            div.attr("not-really","");

            for (int i = bodyContent.size()-1; i >= 0; i--) {
                List<Node> children = bodyContent.get(i);
                div.insertChildren(0,children);
            }
            ArrayList<Node> children = new ArrayList<>();
            children.add(div);
            body.insertChildren(0, children);
        }
        return doc;
    }

    public void stripComments(Document doc) {
        List<Node> comments = new ArrayList<>();
        doc.getAllElements().forEach( elem -> {
            elem.childNodes().forEach( child -> {
                if ( child instanceof Comment) {
                    comments.add(child);
                }
            });
        });

        comments.forEach( node -> node.remove() );
    }

    public static void main(String[] args) throws IOException {
        File file = new File("/home/ruedi/projects/polystrene/bower_components/paper-slider/paper-slider.html");
        ImportShim shim = new ImportShim();
        Element element = shim.shimImports(file, "../", new File("/tmp/shim"), new HashSet<>(), null);
        shim.stripComments((Document) element);
        System.out.println(element);
    }
}
