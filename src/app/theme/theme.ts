import { BrandVariants, createDarkTheme, createLightTheme, Theme } from "@fluentui/react-components";
import { dark } from './dark';
import { light } from './light';

const brand: BrandVariants = { 
    10: "#030207",
    20: "#19122E",
    30: "#291B53",
    40: "#382171",
    50: "#49268F",
    60: "#5D29AD",
    70: "#722CCA",
    80: "#8A30E3",
    90: "#9F3CEF",
    100: "#B24EF3",
    110: "#C261F4",
    120: "#D075F5",
    130: "#DD89F6",
    140: "#E79DF6",
    150: "#F0B2F8",
    160: "#F6C7F9"
};
    
export const lightTheme: Theme = {
    ...createLightTheme(brand),
    ...light
};

export const darkTheme: Theme = {
    ...createDarkTheme(brand),
    ...dark
};

darkTheme.colorBrandForeground1 = brand[110];
darkTheme.colorBrandForeground2 = brand[120];