@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Gate Entry Lines CDS'
@Metadata.ignorePropagatedAnnotations: true
define view entity ZR_GateEntryLines as select from zgateentrylines as GateEntryLines
association to parent ZR_GateEntryHeader as _GateEntryHeader on $projection.GateEntryNo = _GateEntryHeader.GateEntryNo
{

    key gateentryno as GateEntryNo,
    key gateitemno as GateItemNo,
    plant as Plant,
    sloc as SLoc,
    productcode as ProductCode,
    productdesc as ProductDesc,
    uom as UOM,
    partycode as PartyCode,
    partyname as PartyName,
    documentqty as DocumentQty,
    gateqty as GateQty,
    inqty as InQty,
    gst as GST,
    orderqty as OrderQty,
    balqty as BalQty,
    tolerance as Tolerance,
    gatevalue as GateValue,
    rate as Rate,
    documentno as DocumentNo,
    documentitemno as DocumentItemNo,
    remarks as Remarks,
    _GateEntryHeader

}
