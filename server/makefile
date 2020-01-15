CC = clang++-8  
CF = -std=c++17 -O3 -Wfatal-errors  
INC = -I../src/lib -I../src/lib-graph -I../pistache/src -L/usr/local/lib

BINDIR := bin

server: | $(BINDIR)
	$(CC) $(INC) $(CF) server.cpp -o $(BINDIR)/server   -I/usr/local/include/ -L/usr/local/lib/ -lpistache 

client: | $(BINDIR)
	$(CC) $(INC) $(CF) client.cpp -o $(BINDIR)/client

$(BINDIR):
	mkdir $(BINDIR)
