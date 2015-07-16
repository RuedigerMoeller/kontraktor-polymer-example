package org.nustaq.javascript;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Comment;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.nodes.Node;
import org.jsoup.parser.Tag;
import org.jsoup.select.Elements;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;

/**
 * Created by ruedi on 16/07/15.
 */
public class ImportShim {


    public Element shimImports(File htmlFile, String baseUrl, File outputDir, HashSet<String> visited ) throws IOException {
        if ( visited.contains(htmlFile.getCanonicalPath()) )
            return new Element(Tag.valueOf("span"),"").html("<!-- "+htmlFile.getName()+"-->");
        visited.add(htmlFile.getCanonicalPath());
        String compName = htmlFile.getName().substring(0, htmlFile.getName().length() - ".html".length());
        Document doc = Jsoup.parse(htmlFile, "UTF-8", baseUrl);

        // style imports => inline
        // script imports => inline
        // misc import => template + generate linkage doc code

        Elements links = doc.getElementsByTag("link");
        links.forEach(link -> {
            if (link.parent().tagName().equals("head") || true) {
                String rel = link.attr("rel");
                if ("import".equals(rel)) {
                    //                System.out.println("import "+link);
                    String href = link.attr("href");
                    try {
                        File impFi = new File(htmlFile.getParent() + "/" + href);
                        Element imp = shimImports(impFi, baseUrl, outputDir, visited);
                        if (imp instanceof Document) {
                            imp = imp.getElementsByTag("head").first();
                            Integer integer = link.elementSiblingIndex();
                            List<Node> children = new ArrayList<>(imp.children());
                            // children.add(0, new Comment(" == "+impFi.getName()+" == ",""));
                            link.parent().insertChildren(integer, children);
                            link.remove();
                        } else {
                            link.replaceWith(imp);
                        }
                    } catch (IOException e) {
                        e.printStackTrace();
                    }
                } else if ("stylesheet".equals(rel) || "css".equals(rel)) {
                    // System.out.println("css "+link);
                }
            } else {
                int debug = 1;
            }
        });
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
        Element element = shim.shimImports(file, "../", new File("/tmp/shim"), new HashSet<>());
        System.out.println("result "+element);
    }
}
