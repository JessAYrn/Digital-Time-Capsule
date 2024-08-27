
module {
  public type DecodingError = {
    #unexpectedEndOfBytes;
    #unexpectedBreak;
    #invalid: Text;
  };

  public type EncodingError = {
    #invalidValue: Text;
  };
}