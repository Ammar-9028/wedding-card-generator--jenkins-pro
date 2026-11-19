kya bolte 
# Shaadi Card Studio
Wedding invitation generator. Enter details once, get many unique animated cards at the same time; download each as PNG or PDF, or everything as a ZIP / multi-page PDF.
Pure HTML5 + CSS3 + vanilla JS (all cards are generated in the browser as SVG). Packaged with Maven as a WAR for Tomcat 9, Java 21.

## How it works
`engine.js` builds each card from a random spec: 6 layouts x 10 colour themes x 5 patterns x font pairs x effects (falling petals, twinkling stars, shimmering names, rotating mandala).
`export.js` renders the SVG to PNG (fonts embedded), and writes PDF and ZIP files itself, no libraries.
Names and details never leave the browser.

## Build and run
    mvn clean package            # target/shaadi-cards.war
    cp target/shaadi-cards.war $TOMCAT_HOME/webapps/
    http://localhost:8080/shaadi-cards/        (health: /shaadi-cards/health)

## Jenkins (EC2, Tomcat 9 on port 9090)
Pipeline script from SCM -> this repo -> `Jenkinsfile`. The jenkins user must be in the `tomcat` group with write access to `webapps`.
Open `http://<EC2-IP>:9090/shaadi-cards/`.

Note: web fonts load from Google Fonts. Offline, cards still render with fallback fonts.
