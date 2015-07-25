package sample.polymer;

import org.nustaq.kontraktor.util.Log;
import org.nustaq.kson.Kson;
import java.io.File;

/**
 * Created by ruedi on 25.07.2015.
 *
 * Example for a kson based application specific configuration
 *
 */
public class AppConfig {

    public static AppConfig read() {
        try {
            return (AppConfig) new Kson().map(AppConfig.class).readObject(new File("app.kson"));
        } catch (Exception e) {
            Log.Warn(null,"app.kson not found or parse error. "+e.getClass().getSimpleName()+":"+e.getMessage());
            try {
                String sampleconf = new Kson().map(AppConfig.class).writeObject(new AppConfig());
                System.out.println("Defaulting to:\n"+sampleconf);
            } catch (Exception e1) {
                e1.printStackTrace();
            }
        }
        return new AppConfig();
    }

    // initial values are defaults ..

    public boolean devMode = false;
    public int sessionThreads = 1;
    public int clientQSize = 1000;
    public int maxConnections = 10_000;
    public String hostName = "localhost";
    public int port = 8080;

    public String initialBuzz = "Kontraktor WebComponents Polymer Undertow";
    public String resources[] = {
         "./web",
         "./bower_components/"
    };

}
