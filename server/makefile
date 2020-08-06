CC = clang++-8  
CF = -std=c++17 -O3 -Wfatal-errors  
INC = -I../src/lib -I../src/lib-graph -L/usr/local/lib -lpthread

BINDIR := bin

server: | $(BINDIR)
	$(CC) $(INC) $(CF) server.cpp -o $(BINDIR)/server   -I/usr/local/include/ -L/usr/local/lib/ 

server2: | $(BINDIR)
	$(CC) $(INC) -I../src/phd $(CF)  server2.cpp -o $(BINDIR)/server2    -I/usr/local/include/ -L/usr/local/lib/  

client: | $(BINDIR)
	$(CC) $(INC) $(CF) client.cpp -o $(BINDIR)/client

$(BINDIR):
	mkdir $(BINDIR)
