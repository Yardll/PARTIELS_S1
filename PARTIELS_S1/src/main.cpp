#include <iostream>
using namespace std;

int main() {
    const float coutHoraireMeca = 4.0;
    const float coutHoraireElec = 5.0;
    const int capacite = 20;
    int velosDispos = 20;
    int choix = 0;

    while (true) { 
        cout << "\n****** Gestion d'une station de Velo ******\n";
        cout << "--------------------------------------------\n";
        cout << "Velos disponibles : " << velosDispos << endl;
        cout << "Points d'attache disponibles : "
             << capacite - velosDispos << endl;
        cout << "--------------------------------------------\n";

        cout << "1. Emprunter un velo\n";
        cout << "2. Restituer un velo\n";
        cout << "3. Estimer le cout de la location\n";
        cout << "4. Quitter l'application\n";

        cout << "Veuillez entrer votre choix : ";
        cin >> choix;

        if (choix == 1) {
            if (velosDispos > 0) {
                velosDispos--;
                cout << "Velo emprunte.\n";
            } else {
                cout << "Aucun velo disponible.\n";
            }
        } 
        else if (choix == 2) {
            if (velosDispos < capacite) {
                velosDispos++;
                cout << "Velo restitue.\n";
            } else {
                cout << "Station pleine, impossible de restituer.\n";
            }
        } 
        else if (choix == 3) {
            int duree_loc;
            int choix_velo;
            double cout_total = 0;

            cout << "Entrez la duree de location en minutes : ";
            cin >> duree_loc;

            double duree_heures = duree_loc / 60.0;

            cout << "Type de velo (1 = mecanique, 2 = electrique) : ";
            cin >> choix_velo;

            if (choix_velo == 1) {
                cout_total = coutHoraireMeca * duree_heures;
            } else if (choix_velo == 2) {
                cout_total = coutHoraireElec * duree_heures;
            } else {
                cout << "Type de velo invalide.\n";
            }

            if (cout_total > 0) {
                cout << "Le prix de la location est de "
                     << cout_total << " euros.\n";
            }
        } 
        else if (choix == 4) {
            cout << "Au revoir !\n";
            break; 
        } 
        else {
            cout << "Choix invalide, veuillez reessayer.\n";
        }
    }

    return 0;
}
