@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Gate Entry Lines Interface View'
define view entity ZI_GateEntryLines 
  as projection on ZR_GateEntryLines as GateEntryLines
{    

    key GateEntryNo,
    key GateItemNo,
    Plant,
    SLoc,
    ProductCode,
    ProductDesc,
    UOM,
    PartyCode,
    PartyName,
    DocumentQty,
    GateQty,
    InQty,
    GST,
    OrderQty,
    BalQty,
    Tolerance,
    GateValue,
    Rate,
    DocumentNo,
    DocumentItemNo,
    Remarks,
    /* Associations */
    _GateEntryHeader : redirected to parent ZI_GateEntryHeader
}
