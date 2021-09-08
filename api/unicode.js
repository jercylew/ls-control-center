//A utility for converting chinese back and to unicode

//eg: '这是中文字符azAZ'  ->   '8fd9662f4e2d65875b577b260061007a0041005a'
export const strToUnicode = text => {
  let strOut = '';
  for (let i = 0; i < text.length; i++) {
    let code = text.charCodeAt(i);
    let code16Text = code.toString(16);

    if (code16Text.length === 2) {
      code16Text = '00' + code16Text;
    }
    strOut += code16Text;
  }

  return strOut;
};

//eg: '8fd9662f4e2d65875b577b260061007a0041005a' -> '这是中文字符azAZ'
export const strFromUnicode = text => {
  if (text.length % 4 !== 0) {
    console.log('Error, invalid unicode');
    return '';
  }

  let strOut = '';
  for (let i = 0; i < text.length / 4; i++) {
    let chUni16 = text.slice(i * 4, (i + 1) * 4);
    let code16Int = parseInt(chUni16, 16);
    strOut += String.fromCharCode(code16Int);
  }

  return strOut;
};
