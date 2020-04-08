library(tidyr)
library(dplyr)
library(ggplot2)
library(scales)
library(ggpubr)

D <- read.delim2("cophex_32t_2f_r.res", sep="\t")
D = filter(D, State != "FAIL")
D$pytime = as.numeric(as.character(D$pytime))
D$Versions = as.factor(D$Versions)
#D$Connections = as.factor(D$Connections)

D2 = group_by(D, Connections, SigmaNorm, Versions) %>% summarise(meanRes = mean(pytime), sdRes = sd(pytime))


ggplot(D2, aes(y=meanRes, ymax=meanRes+sdRes, ymin=meanRes-sdRes, x=Connections)) +
  ylab("Mean Response Time (s)") +
  geom_line(aes(color=Versions) ) +
  geom_point()+
  xscale("log2")+
#  geom_errorbar() +
  facet_wrap(.~SigmaNorm)
